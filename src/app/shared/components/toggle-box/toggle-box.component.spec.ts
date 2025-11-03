import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ToggleBoxComponent } from './toggle-box.component';

describe('ToggleBoxComponent', () => {
  let component: ToggleBoxComponent;
  let fixture: ComponentFixture<ToggleBoxComponent>;
  CommonTestingModule.setUpTestBed(ToggleBoxComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToggleBoxComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToggleBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
