import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostLoginLandingComponent } from './post-login-landing.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PostLoginLandingComponent', () => {
  let component: PostLoginLandingComponent;
  let fixture: ComponentFixture<PostLoginLandingComponent>;
  CommonTestingModule.setUpTestBed(PostLoginLandingComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PostLoginLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
