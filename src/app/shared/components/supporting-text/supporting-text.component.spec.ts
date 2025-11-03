import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { SupportingTextComponent } from './supporting-text.component';

describe('SupportingTextComponent', () => {
  let component: SupportingTextComponent;
  let fixture: ComponentFixture<SupportingTextComponent>;
  CommonTestingModule.setUpTestBed(SupportingTextComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SupportingTextComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SupportingTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
