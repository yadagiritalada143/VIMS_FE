import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseProgramConfigComponent } from './base-program-config.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('BaseProgramConfigComponent', () => {
  let component: BaseProgramConfigComponent;
  let fixture: ComponentFixture<BaseProgramConfigComponent>;
  CommonTestingModule.setUpTestBed(BaseProgramConfigComponent);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaseProgramConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseProgramConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
