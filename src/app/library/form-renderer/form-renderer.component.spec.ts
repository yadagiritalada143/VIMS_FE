import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormRendererComponent } from './form-renderer.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('FormRendererComponent', () => {
  let component: FormRendererComponent;
  let fixture: ComponentFixture<FormRendererComponent>;
  CommonTestingModule.setUpTestBed(FormRendererComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FormRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
